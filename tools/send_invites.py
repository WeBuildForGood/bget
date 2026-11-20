import os
import resend
from dotenv import load_dotenv

load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY")

FROM_EMAIL = "invitation@buildforgood.world"
REPLY_TO = "founder@buildforgood.world"
SUBJECT = "Heyyyy! 👋"

RECIPIENTS_FILE = "recipients.txt"

# Your final message as HTML
HTML_BODY = """Heyyyy! 👋<br><br>
I came across your work and thought you might vibe with something I'm building! 😭<br><br>
I'm Nikhil, a software developer, and I'm building <strong>Build for Good</strong> 🌱 — a global community bringing together talented, like-minded people from different fields to exchange ideas, collaborate on ambitious projects, build cool stuff, and solve real-world problems together, while having fun along the way!<br><br>
We're just getting started, and it'd be awesome to have you aboard! And if you know any friends who'd vibe with this vision, bring them along toooo! The more great minds, the better. 🤝🚀<br><br>
💻 GitHub: <a href="https://github.com/5h4d0wn1k">https://github.com/5h4d0wn1k</a><br>
🔗 LinkedIn: <a href="https://www.linkedin.com/in/nikhilnagpure24/">https://www.linkedin.com/in/nikhilnagpure24/</a><br>
🌐 Website: <a href="https://buildforgood.world">https://buildforgood.world</a><br>
💬 Discord: <a href="https://discord.gg/vX287vcGRQ">https://discord.gg/vX287vcGRQ</a><br><br>
Low budget, dangerously high ambitions. 💀😂 Lesgoooo!<br><br>
This is a no-reply mail, please do not reply to this address.</strong><br>
For any further conversation, please write to:
</p>
<a href="mailto:founder@buildforgood.world" style="color:#2563eb; text-decoration:underline;">
founder@buildforgood.world
</a>
</p>
"""



def load_recipients(filepath):
    recipients = []
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                email = line.strip()
                # skip empty lines, comments, and "none" placeholders
                if not email or email.lower() == "none" or email.startswith("#"):
                    continue
                # basic validation: must contain @ and a dot in domain part
                if "@" not in email or "." not in email.split("@")[-1]:
                    print(f"⚠️  Skipping invalid email: {email}")
                    continue
                recipients.append(email)
    except FileNotFoundError:
        print(f"❌ Recipients file not found: {filepath}")
    return recipients


def send_invite(email):
    try:
        r = resend.Emails.send({
            "from": FROM_EMAIL,
            "to": [email],
            "reply_to": REPLY_TO,
            "subject": SUBJECT,
            "html": HTML_BODY,
        })
        print(f"✅ {email} -> {r.get('id')}")
    except Exception as e:
        print(f"❌ {email} -> {e}")


if __name__ == "__main__":
    if not os.getenv("RESEND_API_KEY"):
        print("Error: set RESEND_API_KEY environment variable first")
        exit(1)

    recipients = load_recipients(RECIPIENTS_FILE)

    if not recipients:
        print("No valid recipients found. Check recipients.txt")
        exit(1)

    print(f"Sending {len(recipients)} email(s) from {FROM_EMAIL}...")
    print(f"Replies go to: {REPLY_TO}")
    print("-" * 50)
    for email in recipients:
        send_invite(email)
    print("-" * 50)
    print("Done.")