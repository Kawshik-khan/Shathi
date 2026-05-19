from app.services.user import DEFAULT_SETTINGS


def test_default_settings_include_core_sections():
    assert DEFAULT_SETTINGS["personalityMode"] == "calm_therapist"
    assert DEFAULT_SETTINGS["theme"] == "adaptive"
    assert DEFAULT_SETTINGS["connectedApps"]["googleFit"] is False
    assert DEFAULT_SETTINGS["aiMemoryEnabled"] is True


def test_default_settings_do_not_enable_security_placeholders():
    assert DEFAULT_SETTINGS["twoFactorEnabled"] is False
    assert DEFAULT_SETTINGS["biometricLogin"] is False
