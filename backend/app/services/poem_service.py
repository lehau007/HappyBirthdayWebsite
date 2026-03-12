import asyncio

from groq import Groq

from app.config import settings

_client = Groq(api_key=settings.OPENAI_API_KEY)


def _call_groq(prompt: str) -> str:
    """Synchronous Groq streaming call — run in a thread via asyncio.to_thread."""
    completion = _client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[{"role": "user", "content": prompt}],
        temperature=1,
        max_completion_tokens=8192,
        top_p=1,
        reasoning_effort="medium",
        stream=True,
        stop=None,
    )
    result = ""
    for chunk in completion:
        result += chunk.choices[0].delta.content or ""
    return result.strip()


async def generate_birthday_poem(username: str, birthday_info: str | None) -> str:
    """Call Groq to pre-generate a birthday poem (in Vietnamese) for a Normal User."""
    context = birthday_info or "ngày đặc biệt của họ"
    prompt = (
        f"Hãy viết một bài thơ sinh nhật ấm áp, chân thành bằng tiếng Việt "
        f"**Với thông tin người cần chúc**: {context}. "
        "Bài thơ nên có 4–6 dòng, vui tươi và mang đậm tình cảm cá nhân. "
        "**Chỉ trả về bài thơ, không có lời giải thích thêm.**"
    )
    return await asyncio.to_thread(_call_groq, prompt)

