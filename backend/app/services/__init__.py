"""Services package.

Keep this module side-effect free. Individual services can initialize external
clients, so route modules should import the service functions they need from
their concrete modules.
"""

__all__: list[str] = []

