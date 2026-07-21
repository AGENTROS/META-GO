import pymongo
import sys

local_uri = "mongodb://localhost:27017/"
cloud_uri = "mongodb+srv://rakshukoul420_db_user:DJ6NYnrk5k41rjvW@cluster0.xejr22g.mongodb.net/?retryWrites=true&w=majority"

try:
    print("Connecting to local MongoDB...")
    local_client = pymongo.MongoClient(local_uri)
    local_db = local_client["test_database"]
    
    print("Connecting to Cloud MongoDB Atlas...")
    cloud_client = pymongo.MongoClient(cloud_uri)
    cloud_db = cloud_client["test_database"]
    
    # Test Cloud Connection
    cloud_client.admin.command('ping')
    print("Cloud Connection Successful!")
    
    collections = local_db.list_collection_names()
    print(f"Found {len(collections)} collections to migrate: {collections}")
    
    total_docs = 0
    for coll_name in collections:
        print(f"Migrating {coll_name}...")
        local_coll = local_db[coll_name]
        cloud_coll = cloud_db[coll_name]
        
        docs = list(local_coll.find())
        if len(docs) > 0:
            cloud_coll.drop() # avoid duplicates
            cloud_coll.insert_many(docs)
            print(f" -> Inserted {len(docs)} documents into {coll_name}")
            total_docs += len(docs)
        else:
            print(f" -> {coll_name} is empty, skipping.")
            
    print(f"\n==========================================")
    print(f"MIGRATION COMPLETE! {total_docs} DOCUMENTS SHIFTED SUCCESSFULLY!")
    print(f"==========================================")
except Exception as e:
    print(f"Error during migration: {e}")
