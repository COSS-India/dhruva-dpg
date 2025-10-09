import json
import traceback
from typing import List, Optional

from bson import ObjectId
from exception.base_error import BaseError
from exception.client_error import ClientError
from fastapi import Depends, status
from module.auth.repository.api_key_repository import ApiKeyRepository
from schema.services.request import ServiceViewRequest
from schema.services.response import ServiceListResponse, ServiceViewResponse

from ..error.errors import Errors
from ..repository import ModelRepository, ServiceRepository
from db.PostgreSQLBaseRepository import sqlalchemy_to_dict


class DetailsService:
    def __init__(
        self,
        service_repository: ServiceRepository = Depends(ServiceRepository),
        model_repository: ModelRepository = Depends(ModelRepository),
        api_key_repository: ApiKeyRepository = Depends(ApiKeyRepository),
    ) -> None:
        self.service_repository = service_repository
        self.model_repository = model_repository
        self.api_key_repository = api_key_repository

    def get_service_details(self, request: ServiceViewRequest, user_id: ObjectId) -> Optional[ServiceViewResponse]:
        """Get detailed information about a specific service."""
        try:
            service = self.service_repository.find_by_id(request.serviceId)
            if not service:
                raise ClientError(status_code=status.HTTP_404_NOT_FOUND, message="Invalid Service Id")
            
            model = self.model_repository.get_by_model_id(service.model_id)
            api_keys = self.api_key_repository.find({"user_id": user_id})
            
            # Calculate usage inline
            total_usage = sum(srv.usage for key in api_keys if getattr(key, "services") for srv in key.services if srv.service_id == request.serviceId)
            
            # Convert data inline
            service_dict = sqlalchemy_to_dict(service)
            model_dict = sqlalchemy_to_dict(model)
            
            return ServiceViewResponse(
                _id=str(service_dict.get("id")),
                serviceId=service_dict.get("service_id"),
                name=service_dict.get("name"),
                serviceDescription=service_dict.get("service_description"),
                hardwareDescription=service_dict.get("hardware_description"),
                publishedOn=service_dict.get("published_on"),
                modelId=service_dict.get("model_id"),
                healthStatus=service_dict.get("health_status"),
                benchmarks=service_dict.get("benchmarks"),
                model=model_dict,
                key_usage=api_keys,
                total_usage=total_usage
            )
        except ClientError:
            raise
        except Exception:
            raise BaseError(Errors.DHRUVA105.value, traceback.format_exc())

    def list_services(self) -> List[ServiceListResponse]:
        """Get list of all services with their associated model information."""
        try:
            return [
                ServiceListResponse(
                    _id=str((s := sqlalchemy_to_dict(service)).get("id")),
                    serviceId=s.get("service_id"),
                    name=s.get("name"),
                    serviceDescription=s.get("service_description"),
                    hardwareDescription=s.get("hardware_description"),
                    publishedOn=s.get("published_on"),
                    modelId=s.get("model_id"),
                    healthStatus=s.get("health_status"),
                    benchmarks=s.get("benchmarks"),
                    task=self._parse_task(model := self.model_repository.get_by_model_id(service.model_id)),
                    languages=self._parse_languages(model)
                )
                for service in self.service_repository.find_all()
            ]
        except Exception:
            raise BaseError(Errors.DHRUVA103.value, traceback.format_exc())
    
    def _parse_task(self, model):
        """Parse task field from model."""
        m = sqlalchemy_to_dict(model)
        task = m.get("task", {})
        return json.loads(task) if isinstance(task, str) else task
    
    def _parse_languages(self, model):
        """Parse languages field from model."""
        m = sqlalchemy_to_dict(model)
        languages = m.get("languages", [])
        parsed = json.loads(languages) if isinstance(languages, str) else languages
        return [item if isinstance(item, dict) else {} for item in parsed] if isinstance(parsed, list) else []
