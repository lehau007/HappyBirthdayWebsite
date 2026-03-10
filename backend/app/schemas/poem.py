from pydantic import BaseModel


class PoemOut(BaseModel):
    poem_text: str

    model_config = {"from_attributes": True}
