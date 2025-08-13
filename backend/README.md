Backend for netwrk, a platform to manage, track, and grow your network around the world

Problem:
- LinkedIn is not great for using your network
  - LinkedIn is inflexible to search (find names using a handful of filters)
  - Spam problem and impersonal links to many connections so hard to communicate on
- Need a better way to find people with knowledge/connections you're looking for
  - Find people in your network with natural language queries on netwrk
  - Searches database of combined LinkedIn and user-inputted data
  - Combines search of structured data like location with search of unstructured data like bios

Functionality:
- Search your network by
  - location
  - field
  - your description of the person
  - linkedin bio
  - etc.
- Get lists of best matches to the query
- Open profile to get all data and contact info

Implementation:
- Location heirarchical tree -> Boston / Boston is perfect match, Boston / USA is partial match
  - Probably a google maps API that does this
- Vector search for unstructured text data
  - Use LM head to encode descriptions and linkedin bios as vectors and store in vector DB
    - sentence-transformers from huggingface for embeddings and https://github.com/facebookresearch/faiss to search
  - Use a vector search algorithm or search engine to find closest semantic match to query
  - Concatenate desc and bio to reduce number of searches
- Alternative:
  - keyword extraction to find things like field, location, job title, etc. in data and query
    - NOT KEYWORD EXTRACTION - it's called something else
  - compare vector of keywords from data to that from query
- Not using crossencoders because biencoders are faster (dont need to run model on each pair for every query)


Monetization:
- Charge for premium account with over 100 connections
