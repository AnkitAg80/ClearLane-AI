# GitHub Cleanup

## What Changed

Generated data artifacts under `data/` were removed from Git tracking while keeping the local files on disk.

Internal planning documents under `docs/superpowers/` were also removed from Git tracking.

The `.gitignore` file now ignores the full `data/` folder and `docs/superpowers/`, while allowing project-facing docs such as `docs/CII_METHOD.md` and `docs/NEXT_3H_MODEL.md` to be tracked.

## Where It Changed

The Git index was updated with `git rm --cached -r data docs/superpowers`.

The ignore rules changed in `.gitignore`.

This note lives in `readme_github_cleanup.md` at the project root.

## Why It Helps

The main GitHub repository should contain source code, tests, configuration, frontend assets, and useful documentation. Large generated model/data artifacts and internal planning files make the repository heavy and distract reviewers.

## What Should Happen Next

Keep raw datasets and generated artifacts local, or publish them separately through release assets, cloud storage, or a data artifact link if judges need them.
