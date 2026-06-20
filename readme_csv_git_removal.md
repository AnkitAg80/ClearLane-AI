# CSV Git Removal

## What Changed

The oversized anonymized violation CSV was removed from Git tracking while remaining on the local filesystem.

The root `.gitignore` now ignores the `dataset/` directory so the same local dataset does not get re-added accidentally.

## Where It Changed

The ignore rule changed in `.gitignore`.

The tracked file removed from the branch commit was `dataset/jan to may police violation_anonymized791b166.csv`.

This note lives in `readme_csv_git_removal.md` at the project root.

## Why It Helps

GitHub rejects normal Git pushes that contain files larger than 100 MB. This CSV was about 104 MB, so the branch could not be published.

Removing the file from the branch commit lets the code branch publish normally while keeping the dataset available locally for development.

## What Should Happen Next

Publish the branch with `git push -u origin codex-dataset-alignment-phases`.

If the dataset needs to be shared later, use Git LFS or an external data store instead of committing it as a normal Git blob.
