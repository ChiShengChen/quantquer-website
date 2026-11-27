#!/usr/bin/env python3
"""Re-run four synthetic quote-gate fixtures against a pinned public checkout."""

import argparse
import importlib.util
import json
import subprocess
from pathlib import Path

COMMIT = "ac6e83c63252049bbccbf19bbf7f3dbc334ac0b7"
MODULE = "src/paper_evidence/quote_gate.py"
REPOSITORY = "https://github.com/ChiShengChen/paper-evidence"
OUTPUT = Path(__file__).resolve().parents[1] / "assets/evidence/research/quote-gate.json"
QUOTE = "The synthetic baseline recorded 3.2 ms median latency."
SECOND_SECTION = (
    "A separate synthetic experiment recorded 8.4 ms for a different workload. "
    "That number belongs to the second experiment."
)
DIVIDER = (
    "The first section then describes its test fixture, its input format, its sampling protocol, "
    "the summary used for reporting, and the verification notes. "
    "The next section presents a separate experiment with a different input and testing procedure. "
)
SOURCE = f"{QUOTE} {DIVIDER}{SECOND_SECTION}"
FIXTURES = (
    ("exact", QUOTE, ["3.2 ms"], "EXACT", True),
    ("normalized", QUOTE.replace("recorded ", "recorded\n").replace("3.2", "３.２"), ["3.2 ms"], "NORMALIZED", True),
    ("out-of-context", QUOTE, ["8.4 ms"], "NUM_FAIL", False),
    ("unlocated", "The hardware doubled throughput across all test runs.", [], "FAIL", False),
)


def load_gate(checkout):
    def git(*args):
        return subprocess.check_output(["git", "-C", str(checkout), *args])

    actual_commit = git("rev-parse", "HEAD").decode().strip()
    if actual_commit != COMMIT:
        raise SystemExit(f"Check out public revision {COMMIT} first.")
    actual_source = checkout / MODULE
    if actual_source.read_bytes() != git("show", f"{COMMIT}:{MODULE}"):
        raise SystemExit("The quote gate differs from the pinned commit.")
    spec = importlib.util.spec_from_file_location("_quantquer_public_quote_gate", actual_source)
    if spec is None or spec.loader is None:
        raise SystemExit("Could not import the public quote gate.")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def reproduce(checkout):
    gate = load_gate(checkout)
    cases = []
    for name, quote, numbers, expected_status, expected_pass in FIXTURES:
        result = gate.verify_quote(quote, SOURCE, numbers, allow_fuzzy=False, num_window=200)
        if (result["status"], result["ok"]) != (expected_status, expected_pass):
            raise SystemExit(f"Unexpected result for {name}: {result}")
        cases.append({
            "id": name,
            "quote": quote,
            "numbers": numbers,
            "status": result["status"],
            "passed": result["ok"],
        })
    return {
        "repository": REPOSITORY,
        "commit": COMMIT,
        "fixtureType": "synthetic",
        "source": SOURCE,
        "numberWindow": 200,
        "fuzzyAllowed": False,
        "cases": cases,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("checkout", type=Path, help="Pinned public paper-evidence checkout")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--write", action="store_true", help="Store the replay as a JSON asset")
    mode.add_argument("--check", action="store_true", help="Check the committed replay")
    args = parser.parse_args()
    rendered = json.dumps(reproduce(args.checkout.resolve()), indent=2, ensure_ascii=False) + "\n"
    if args.write:
        OUTPUT.write_text(rendered, encoding="utf-8")
    elif args.check:
        if OUTPUT.read_text(encoding="utf-8") != rendered:
            raise SystemExit("Replay differs from the pinned public quote gate.")
        print("PASS: all four synthetic quote-gate fixtures matched the replay.")
    else:
        print(rendered, end="")


if __name__ == "__main__":
    main()
