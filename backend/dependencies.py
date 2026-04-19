from fastapi import Header, HTTPException


def get_tenant_id(x_tenant_id: int = Header(..., alias="X-Tenant-ID")) -> int:
    """Extract tenant ID from X-Tenant-ID request header."""
    return x_tenant_id
