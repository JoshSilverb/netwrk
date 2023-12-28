import faiss
import numpy as np

# Function to normalize vectors
def normalize_vectors(vectors):
    norms = np.linalg.norm(vectors, axis=1)
    return vectors / norms[:, np.newaxis]

# Function to perform vector similarity search
def vector_similarity_search(query_vector, index, k=5):
    query_vector = normalize_vectors(query_vector)
    _, indices = index.search(query_vector, k)
    return indices

# Generate some example embeddings
embeddings = np.random.rand(100, 300).astype('float32')
normalized_embeddings = normalize_vectors(embeddings)

# Build the index
index = faiss.IndexFlatIP(embeddings.shape[1])
index.add(normalized_embeddings)

# Example query vector
query = np.random.rand(1, 300).astype('float32')

# Perform vector similarity search
results = vector_similarity_search(query, index)

print('Similar vectors:')
for idx in results[0]:
    print(embeddings[idx])