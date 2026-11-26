"""Validation for catalogue photograph source reuse approvals."""
from collections import defaultdict


APPROVED_REUSE = {
    "source": "https://commons.wikimedia.org/wiki/File:Manali_India_5.jpg",
    "package_ids": frozenset({"MH-002", "MH-025"}),
    "approval": {
        "approvalId": "owner-approval-2026-11-26-mh002-mh025",
        "approvedBy": "Business owner",
        "approvedOn": "2026-11-26",
        "packageIds": ["MH-002", "MH-025"],
        "reason": "Owner-approved reuse of the cleared Manali India 5 photograph for the two Manali packages.",
    },
}


def find_duplicate_source_errors(photos):
    """Return errors for every duplicate source except the one explicit approval."""
    by_source = defaultdict(list)
    for package_id, metadata in photos.items():
        source = metadata.get("source")
        if source:
            by_source[source].append((package_id, metadata))

    errors = []
    for source, entries in by_source.items():
        if len(entries) < 2:
            continue

        package_ids = frozenset(package_id for package_id, _ in entries)
        approved = (
            source == APPROVED_REUSE["source"]
            and package_ids == APPROVED_REUSE["package_ids"]
            and all(metadata.get("sourceReuseApproval") == APPROVED_REUSE["approval"]
                    for _, metadata in entries)
        )
        if not approved:
            ids = ", ".join(sorted(package_ids))
            errors.append(f"Duplicate photograph source: {source} ({ids})")
    return errors
