import re
import numpy as np
import tensorflow_hub as hub

# Load Universal Sentence Encoder once at startup
_USE_URL = "https://tfhub.dev/google/universal-sentence-encoder/4"
_embed = hub.load(_USE_URL)

# Minimal stopwords for query cleanup
_STOP = {
    "the","a","an","and","or","to","of","for","in","on",
    "with","about","what","is","are","how","i","you","me","my"
}

def normalize(text: str) -> str:
    text = re.sub(r"[^a-zA-Z0-9\s]", " ", text.lower())
    text = re.sub(r"\s+", " ", text).strip()
    return text

def keywords(q: str, k: int = 8):
    toks = [t for t in normalize(q).split(" ") if t and t not in _STOP]
    return toks[:k]

def expansions(q: str):
    base = " ".join(keywords(q))
    if not base:
        base = normalize(q)
    cand = [
        base,
        f"{base} tutorial",
        f"{base} explained",
        f"{base} basics",
        f"{base} for beginners",
        f"{base} course",
        f"{base} guide"
    ]
    # Deduplicate while preserving order
    seen, out = set(), []
    for s in cand:
        if s not in seen and s:
            seen.add(s); out.append(s)
    return out

def embed_text(texts):
    # Returns np.ndarray [N, 512]
    embs = _embed(texts).numpy()
    return embs

def cosine_batch(q_vec: np.ndarray, items: np.ndarray):
    # q_vec: [512], items: [N,512] => [N]
    qn = np.linalg.norm(q_vec) + 1e-9
    inorm = np.linalg.norm(items, axis=1) + 1e-9
    dots = items @ q_vec
    return (dots / (qn * inorm)).tolist()

def score_items(query: str, items_texts):
    # items_texts: list[str], score by USE cosine to query
    model_in = [query] + items_texts
    embs = embed_text(model_in)
    q_vec = embs[0]
    i_vecs = embs[1:]
    scores = cosine_batch(q_vec, i_vecs)
    return scores
