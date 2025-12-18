# Do No Harm Policy

_Last updated: 2025/12/18_

## 1. Purpose
This policy describes the Dhruva platform’s approach to minimizing misuse and unintended harm, consistent with its role as an infrastructure service.

Dhruva provides backend services and inference infrastructure. It does not create, curate, publish, or moderate end-user content.

---

## 2. Scope
This policy applies to:
- Dhruva backend services
- Dhruva APIs
- Dhruva inference and audio processing pipelines

Applications built on top of Dhruva are operated by downstream integrators, who are responsible for end-user interactions, content moderation, and compliance with applicable laws.

---

## 3. Platform Role and Responsibility Boundaries
Dhruva operates as an infrastructure platform that enables authenticated users to access AI services.

- Dhruva does not independently generate content.
- Dhruva does not determine how outputs are used.
- Dhruva does not apply application-level content moderation or harm classification.

Safeguards described in this policy apply at the platform and access-control level only.

---

## 4. Potential Harm Scenarios
Dhruva acknowledges that misuse of AI infrastructure may result in harms such as:
- Use of AI outputs in inappropriate or misleading contexts
- Unauthorized or excessive use of platform resources
- Use of downstream applications in ways not intended by their operators

These risks are primarily managed by downstream integrators and deployers.

---

## 5. Platform-Level Harm Mitigation Measures
Dhruva applies reasonable, platform-level controls intended to reduce misuse, including:
- Controlled access through authentication and API keys
- Role-based authorization for platform functions
- Administrative management and revocation of access credentials
- Operational monitoring for system reliability and security

Dhruva does not implement content-level harm prevention or moderation at the infrastructure layer.

---

## 6. Abuse Prevention and Detection
Dhruva does not perform automated detection of harmful or inappropriate content.

- Access credentials may be revoked or modified through administrative action when required
- Operational logs and metrics are used to support reliability, security, and troubleshooting

Any actions are taken based on available operational information and platform scope.

---

## 7. Reporting and Escalation
Concerns related to misuse of the platform may be communicated to the project maintainers through the contact channels documented in the repository.

Reports are reviewed on a best-effort basis, considering available information and the platform’s responsibility boundaries.

---

## 8. Transparency and Accountability
Dhruva is committed to transparency regarding:
- Its role as infrastructure
- The limitations of platform-level safeguards
- The responsibilities of downstream integrators

This policy is publicly available to support responsible use.

---

## 9. Continuous Improvement
Platform safeguards and this policy may be updated as the platform evolves or as new risks are identified.

---

## 10. Contact
For questions or concerns related to this policy, please contact:

<CONTACT EMAIL OR SUPPORT CHANNEL>