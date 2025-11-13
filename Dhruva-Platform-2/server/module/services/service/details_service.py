import copy
import os
import traceback
from typing import List, Optional

from bson import ObjectId
from exception.base_error import BaseError
from exception.client_error import ClientError
from fastapi import Depends, status
from module.auth.repository.api_key_repository import ApiKeyRepository
from pydantic import AnyHttpUrl, parse_obj_as
from schema.services.request import CreateSnapshotRequest, ServiceViewRequest
from schema.services.response import ServiceListResponse, ServiceViewResponse

from ..error.errors import Errors
from ..repository import ModelRepository, ServiceRepository


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

    def get_service_details(
        self, request: ServiceViewRequest, user_id: ObjectId
    ) -> Optional[ServiceViewResponse]:
        try:
            service = self.service_repository.find_by_service_id(request.serviceId)
            if not service:
                # Fallback: try to find by UUID if serviceId happens to be a UUID
                service = self.service_repository.find_by_id(request.serviceId)
        except:
            raise BaseError(Errors.DHRUVA104.value, traceback.format_exc())

        if not service:
            raise ClientError(
                status_code=status.HTTP_404_NOT_FOUND, message="Invalid Service Id"
            )

        try:
            model = self.model_repository.get_one(model_id=service.model_id)
        except:
            raise BaseError(Errors.DHRUVA105.value, traceback.format_exc())

        try:
            # Sending all services in the response temporariliy
            # TODO: convert the find result object to dict and create a new copy
            total_usage = 0
            api_keys = self.api_key_repository.find(user_id=user_id)
            for key in api_keys:
                if getattr(key, "services"):
                    for srv in key.services:
                        if srv.service_id == request.serviceId:
                            total_usage += srv.usage
                            break

        except Exception:
            raise BaseError(Errors.DHRUVA105.value, traceback.format_exc())

        # Map SQLAlchemy fields (snake_case) to response schema (camelCase/aliases)
        service_payload = {
            "serviceId": service.service_id,
            "name": service.name,
            "serviceDescription": getattr(service, "service_description", None),
            "hardwareDescription": getattr(service, "hardware_description", None),
            "publishedOn": getattr(service, "published_on", None),
            "modelId": service.model_id,
            "healthStatus": getattr(service, "health_status", None),
            "benchmarks": getattr(service, "benchmarks", None),
        }

        # Build model payload from SQLAlchemy model
        # Build model payload with required fields per schema
        # Ensure types: task (dict), languages (list), domain (list), submitter (dict)
        model_task = getattr(model, "task", {}) or {}
        model_languages = getattr(model, "languages", []) or []
        model_domain = getattr(model, "domain", []) or []
        if not isinstance(model_domain, list):
            model_domain = [model_domain]
        model_submitter = getattr(model, "submitter", {}) or {}

        model_payload = {
            "modelId": model.model_id,
            "version": getattr(model, "version", None),
            "submittedOn": getattr(model, "submitted_on", None),
            "updatedOn": getattr(model, "updated_on", None),
            "name": model.name,
            "description": getattr(model, "description", None),
            "refUrl": getattr(model, "ref_url", None),
            "task": model_task if isinstance(model_task, dict) else {},
            "languages": model_languages if isinstance(model_languages, list) else [],
            "license": getattr(model, "license", None),
            "domain": model_domain,
            "inferenceEndPoint": getattr(model, "inference_endpoint", None),
            "submitter": model_submitter if isinstance(model_submitter, dict) else {},
            "source": "dhruva",
        }

        # key_usage must be list of dicts; if repository returns ORM objects, coerce to dicts
        try:
            key_usage_list = []
            for k in api_keys:
                if isinstance(k, dict):
                    key_usage_list.append(k)
                else:
                    # fallback minimal serialization
                    key_usage_list.append({field: getattr(k, field, None) for field in dir(k) if not field.startswith("_")})
        except Exception:
            key_usage_list = []

        return ServiceViewResponse(
            **service_payload,
            model=model_payload,
            key_usage=key_usage_list,
            total_usage=total_usage,
        )

    def list_services(self) -> List[ServiceListResponse]:
        try:
            services_list = self.service_repository.find_all()
        except:
            raise BaseError(Errors.DHRUVA103.value, traceback.format_exc())

        response_list: List[ServiceListResponse] = []
        for service in services_list:
            try:
                model = self.model_repository.get_one(model_id=service.model_id)
            except:
                raise BaseError(Errors.DHRUVA105.value, traceback.format_exc())

            response_list.append(
                ServiceListResponse(
                    serviceId=service.service_id,
                    name=service.name,
                    serviceDescription=getattr(service, "service_description", None),
                    hardwareDescription=getattr(service, "hardware_description", None),
                    publishedOn=getattr(service, "published_on", None),
                    modelId=service.model_id,
                    healthStatus=getattr(service, "health_status", None),
                    benchmarks=getattr(service, "benchmarks", None),
                    task=getattr(model, "task", {}) or {},
                    languages=getattr(model, "languages", []) or [],
                )
            )

        return response_list
