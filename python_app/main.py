from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Any
from .nlp import expansions, score_items

app = FastAPI(title="NLP Service", version="1.0.0")

class AnalyzeIn(BaseModel):
    q: str

class AnalyzeOut(BaseModel):
    expansions: List[str]

class ScoreIn(BaseModel):
    q: str
    items: List[Dict[str, Any]]  # {id: str, text: str}

class ScoreOut(BaseModel):
    scores: List[float]

@app.post("/nlp/analyze", response_model=AnalyzeOut)
def analyze(inp: AnalyzeIn):
    ex = expansions(inp.q)
    return AnalyzeOut(expansions=ex)

@app.post("/nlp/score", response_model=ScoreOut)
def score(inp: ScoreIn):
    texts = [str(it.get("text","")) for it in inp.items]
    sc = score_items(inp.q, texts)
    return ScoreOut(scores=sc)
