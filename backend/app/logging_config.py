"""Structured JSON logging (spec §5). Plain stdlib logging + a JSON formatter
— no extra dependency required."""

import json
import logging
import sys

_CONFIGURED = False


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "time": self.formatTime(record, "%Y-%m-%dT%H:%M:%S"),
        }
        extra = getattr(record, "extra_fields", None)
        if extra:
            payload.update(extra)
        return json.dumps(payload)


class _StructuredLogger(logging.LoggerAdapter):
    def process(self, msg, kwargs):
        return msg, kwargs

    def _log_structured(self, level: int, event: str, **fields):
        self.logger.log(level, event, extra={"extra_fields": fields})

    def info(self, event: str, **fields):
        self._log_structured(logging.INFO, event, **fields)

    def warning(self, event: str, **fields):
        self._log_structured(logging.WARNING, event, **fields)

    def error(self, event: str, **fields):
        self._log_structured(logging.ERROR, event, **fields)


def _configure_once():
    global _CONFIGURED
    if _CONFIGURED:
        return
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())
    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(logging.INFO)
    _CONFIGURED = True


def get_logger(name: str) -> _StructuredLogger:
    _configure_once()
    return _StructuredLogger(logging.getLogger(name), {})
