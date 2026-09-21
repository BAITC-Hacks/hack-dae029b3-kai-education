"""Терминальный FAQ-бот без внешних зависимостей."""

from pathlib import Path
import re
import sys


# Группы соответствуют пяти строкам faq.txt: время, команда, трек, сдача, призы.
KEYWORDS = (
    ("когда", "врем", "нач", "час", "длит", "долго", "минут", "сколько"),
    ("команд", "участник", "состав"),
    ("трек", "направлен", "кейс", "тем"),
    ("сда", "сдат", "сдать", "сдач", "отправ", "загруз", "репозитор", "github", "гитхаб", "readme"),
    ("приз", "наград", "подар", "выигр"),
)


def load_faq():
    lines = Path(__file__).with_name("faq.txt").read_text(encoding="utf-8").splitlines()
    pairs = [line.split("\t", 1) for line in lines if line.strip()]
    if len(pairs) != len(KEYWORDS) or any(
        len(pair) != 2 or not all(part.strip() for part in pair) for pair in pairs
    ):
        raise ValueError("В faq.txt нужны 5 строк: вопрос, табуляция, ответ.")
    return pairs


def answer(question, faq):
    words = set(re.findall(r"[а-яa-z0-9]+", question.lower().replace("ё", "е")))
    scores = [
        sum(any(word.startswith(stem) for stem in stems) for word in words)
        for stems in KEYWORDS
    ]
    best = max(scores)
    if best == 0 or scores.count(best) != 1:
        return "не знаю"
    return faq[scores.index(best)][1]


def main():
    try:
        faq = load_faq()
    except (OSError, ValueError) as error:
        print(f"Не удалось загрузить FAQ: {error}", file=sys.stderr)
        return 1
    print("FAQ-бот: задайте вопрос о времени, команде, треке, сдаче или призах.")
    print("Для завершения введите /exit или выход.")
    while True:
        try:
            question = input("Вы: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nДо встречи!")
            break
        if question.lower() in ("/exit", "выход"):
            print("До встречи!")
            break
        if question:
            print(f"Бот: {answer(question, faq)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
