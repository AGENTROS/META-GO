class BaseTransport:
    async def send(self, data):
        pass

    async def receive(self):
        pass

    async def close(self):
        pass
