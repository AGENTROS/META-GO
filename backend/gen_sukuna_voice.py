import asyncio
import os
import edge_tts

async def main():
    text = "I am your MetaGo AI Identity Guardian, Ryomen Sukuna voice core activated. I monitor your trust score, humanity index, and security logs in real time."
    # ChristopherNeural is deep male anime/villain voice
    communicate = edge_tts.Communicate(text, "en-US-ChristopherNeural", pitch="-25Hz", rate="-10%")
    output_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "audio", "guardian_sukuna.mp3")
    await communicate.save(output_path)
    print("Generated Sukuna audio at:", output_path)

if __name__ == "__main__":
    asyncio.run(main())
