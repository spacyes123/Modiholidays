"""Regression tests for approved and accidental duplicate photo sources."""
import copy
import unittest

from photo_sources import APPROVED_REUSE, find_duplicate_source_errors


def manifest_entry(source, approval=None):
    entry = {"source": source}
    if approval is not None:
        entry["sourceReuseApproval"] = copy.deepcopy(approval)
    return entry


class DuplicatePhotoSourceTests(unittest.TestCase):
    def test_owner_approved_manali_pair_is_allowed(self):
        photos = {
            "MH-002": manifest_entry(APPROVED_REUSE["source"], APPROVED_REUSE["approval"]),
            "MH-025": manifest_entry(APPROVED_REUSE["source"], APPROVED_REUSE["approval"]),
        }
        self.assertEqual(find_duplicate_source_errors(photos), [])

    def test_unapproved_duplicate_source_is_rejected(self):
        source = "https://commons.wikimedia.org/wiki/File:Other.jpg"
        photos = {"MH-002": manifest_entry(source), "MH-025": manifest_entry(source)}
        self.assertEqual(len(find_duplicate_source_errors(photos)), 1)

    def test_approved_source_without_manifest_approval_is_rejected(self):
        photos = {
            "MH-002": manifest_entry(APPROVED_REUSE["source"], APPROVED_REUSE["approval"]),
            "MH-025": manifest_entry(APPROVED_REUSE["source"]),
        }
        self.assertEqual(len(find_duplicate_source_errors(photos)), 1)

    def test_approval_cannot_be_copied_to_another_source_or_package_pair(self):
        source = "https://commons.wikimedia.org/wiki/File:Other.jpg"
        photos = {
            "MH-002": manifest_entry(source, APPROVED_REUSE["approval"]),
            "MH-025": manifest_entry(source, APPROVED_REUSE["approval"]),
        }
        self.assertEqual(len(find_duplicate_source_errors(photos)), 1)

        photos = {
            "MH-002": manifest_entry(APPROVED_REUSE["source"], APPROVED_REUSE["approval"]),
            "MH-003": manifest_entry(APPROVED_REUSE["source"], APPROVED_REUSE["approval"]),
        }
        self.assertEqual(len(find_duplicate_source_errors(photos)), 1)

    def test_extra_package_using_approved_source_is_rejected(self):
        approval = APPROVED_REUSE["approval"]
        photos = {
            "MH-002": manifest_entry(APPROVED_REUSE["source"], approval),
            "MH-025": manifest_entry(APPROVED_REUSE["source"], approval),
            "MH-030": manifest_entry(APPROVED_REUSE["source"], approval),
        }
        self.assertEqual(len(find_duplicate_source_errors(photos)), 1)


if __name__ == "__main__":
    unittest.main()
