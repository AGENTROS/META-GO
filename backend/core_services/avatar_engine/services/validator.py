class AvatarValidator:
    ALLOWED_EXTENSIONS = {".glb", ".vrm"}
    MAX_SIZE_MB = 50

    @classmethod
    def validate_asset(cls, asset_url: str, metadata: dict) -> bool:
        """Simulated validation logic for asset compatibility."""
        if not any(asset_url.endswith(ext) for ext in cls.ALLOWED_EXTENSIONS):
            raise ValueError(f"Invalid file type. Allowed: {cls.ALLOWED_EXTENSIONS}")

        if metadata.get("size_mb", 0) > cls.MAX_SIZE_MB:
            raise ValueError(f"File too large. Max allowed: {cls.MAX_SIZE_MB}MB")

        if metadata.get("skeleton_type") != "humanoid":
            raise ValueError("Only 'humanoid' skeletons are currently supported for cross-platform animation compatibility.")

        return True
