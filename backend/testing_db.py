import asyncio
import itertools
import copy
import uuid

class AsyncInMemoryCursor:
    def __init__(self, docs):
        self._docs = docs
        self._sort_key = None
        self._sort_desc = False
        self._limit = None

    def sort(self, key, direction=-1):
        self._sort_key = key
        self._sort_desc = (direction == -1)
        return self

    def limit(self, n):
        self._limit = n
        return self

    def __aiter__(self):
        docs = list(self._docs)
        if self._sort_key:
            docs.sort(key=lambda d: d.get(self._sort_key, ""), reverse=self._sort_desc)
        if self._limit is not None:
            docs = docs[:self._limit]
        
        async def gen():
            for d in docs:
                yield copy.deepcopy(d)
        return gen()

class AsyncInMemoryCollection:
    def __init__(self):
        self._docs = []
        self._lock = asyncio.Lock()

    def _match_filter(self, d, filter) -> bool:
        for k, v in filter.items():
            val = d.get(k)
            if isinstance(v, dict):
                if "$ne" in v:
                    if val == v["$ne"]:
                        return False
                elif "$nin" in v:
                    if val in v["$nin"]:
                        return False
                elif "$in" in v:
                    if val not in v["$in"]:
                        return False
            else:
                if val != v:
                    return False
        return True

    async def insert_one(self, doc):
        async with self._lock:
            d = copy.deepcopy(doc)
            if "_id" not in d:
                d["_id"] = str(uuid.uuid4())
            self._docs.append(d)
            return type("R", (), {"inserted_id": d["_id"]})()

    async def find_one(self, filter):
        async with self._lock:
            for d in self._docs:
                if self._match_filter(d, filter):
                    return copy.deepcopy(d)
            return None

    def find(self, filter=None):
        filter = filter or {}
        matching_docs = []
        for d in list(self._docs):
            if self._match_filter(d, filter):
                matching_docs.append(copy.deepcopy(d))
        return AsyncInMemoryCursor(matching_docs)

    async def count_documents(self, filter):
        async with self._lock:
            count = 0
            for d in self._docs:
                if self._match_filter(d, filter):
                    count += 1
            return count

    async def delete_many(self, filter):
        async with self._lock:
            initial_count = len(self._docs)
            new_docs = []
            for d in self._docs:
                if not self._match_filter(d, filter):
                    new_docs.append(d)
            self._docs = new_docs
            deleted_count = initial_count - len(self._docs)
            return type("R", (), {"deleted_count": deleted_count})()

    async def update_many(self, filter, update):
        async with self._lock:
            modified_count = 0
            for idx, d in enumerate(self._docs):
                if self._match_filter(d, filter):
                    new = copy.deepcopy(d)
                    if "$set" in update:
                        for kk, vv in update["$set"].items():
                            new[kk] = vv
                    self._docs[idx] = new
                    modified_count += 1
            return type("R", (), {"matched_count": modified_count, "modified_count": modified_count})()

    async def update_one(self, filter, update, upsert=False):
        async with self._lock:
            for idx, d in enumerate(self._docs):
                if self._match_filter(d, filter):
                    new = copy.deepcopy(d)
                    # support $set
                    if "$set" in update:
                        for kk, vv in update["$set"].items():
                            new[kk] = vv
                    # support $setOnInsert (ignored on existing)
                    if "$setOnInsert" in update:
                        for kk, vv in update["$setOnInsert"].items():
                            if kk not in new:
                                new[kk] = vv
                    # support $push with $each and $slice
                    if "$push" in update:
                        for kk, vv in update["$push"].items():
                            if kk not in new or not isinstance(new[kk], list):
                                new[kk] = []
                            if isinstance(vv, dict) and "$each" in vv:
                                new[kk].extend(vv["$each"])
                                if "$slice" in vv:
                                    slice_n = vv["$slice"]
                                    new[kk] = new[kk][-slice_n:]
                            else:
                                new[kk].append(vv)
                    # support $addToSet
                    if "$addToSet" in update:
                        for kk, vv in update["$addToSet"].items():
                            if kk not in new or not isinstance(new[kk], list):
                                new[kk] = []
                            if vv not in new[kk]:
                                new[kk].append(vv)
                    self._docs[idx] = new
                    return type("R", (), {"matched_count": 1, "modified_count": 1})()
            # not found
            if upsert:
                d = copy.deepcopy(filter)
                if "$setOnInsert" in update:
                    for kk, vv in update["$setOnInsert"].items():
                        d[kk] = vv
                if "$set" in update:
                    for kk, vv in update["$set"].items():
                        d[kk] = vv
                if "walletAddress" in d:
                    d["walletAddress"] = d["walletAddress"].lower()
                if "_id" not in d:
                    d["_id"] = str(uuid.uuid4())
                self._docs.append(d)
                return type("R", (), {"matched_count": 0, "upserted_id": d["_id"]})()
            return type("R", (), {"matched_count": 0, "modified_count": 0})()

    async def create_index(self, keys, **kwargs):
        return keys


class AsyncInMemoryDB:
    def __init__(self):
        self.users = AsyncInMemoryCollection()
        self.sessions = AsyncInMemoryCollection()
        self.zk_proofs = AsyncInMemoryCollection()
        self.sbts = AsyncInMemoryCollection()
        self.used_nullifiers = AsyncInMemoryCollection()
        self.cross_chain_syncs = AsyncInMemoryCollection()
        self.demo_attempts = AsyncInMemoryCollection()
        self.encryption_keys = AsyncInMemoryCollection()
        self.messages = AsyncInMemoryCollection()
        self.audit_logs = AsyncInMemoryCollection()
        self.sync_operations = AsyncInMemoryCollection()
        self.reconciliation_state = AsyncInMemoryCollection()
        self.registrations = AsyncInMemoryCollection()
        self.refresh_tokens = AsyncInMemoryCollection()


    async def command(self, cmd):
        # support simple 'ping' used by health checks
        if isinstance(cmd, str) and cmd.lower() == "ping":
            return {"ok": True}
        return {"ok": False, "cmd": cmd}

def get_test_db():
    return AsyncInMemoryDB()

