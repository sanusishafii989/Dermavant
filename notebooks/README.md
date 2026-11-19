# Aetheris Health Kaggle training notebooks

These are experimental, clinician-review-only baselines. They do not produce a deployable diagnostic medical model.

## Run order

1. Upload [`01_isic_lesion_risk_kaggle.ipynb`](./01_isic_lesion_risk_kaggle.ipynb) to Kaggle and attach only `roscoekerby/isic-2024-permissive-training-input`.
2. Enable **GPU T4 x2**, then run every cell in order. Download the files written to `/kaggle/working/aetheris_isic_v1/`.
3. Upload [`02_scin_common_triage_kaggle.ipynb`](./02_scin_common_triage_kaggle.ipynb) and attach only `nikita2998/scin-dataset`. The current Kaggle mount is `/kaggle/input/datasets/nikita2998/scin-dataset/SCIN-dataset`.
4. Enable **GPU T4 x2**, run every cell, and download `/kaggle/working/aetheris_scin_v1/`.

The first code cell in each notebook installs pinned Python packages, including `Pillow==10.4.0` to remain compatible with Kaggle's `torchvision` build. Turn on Kaggle Internet for that initial dependency installation and, if required, the ImageNet EfficientNet weights download. **Restart the Kaggle session after that cell completes**, then resume at the next cell. Commit a version that runs reproducibly with Internet off.

## What each notebook exports

| Notebook | Export | Meaning |
| --- | --- | --- |
| ISIC lesion-risk | `aetheris_isic_lesion_risk_v1.pt` | EfficientNet-B0 checkpoint, validation-derived calibration, and clinician-review threshold. |
| SCIN common triage | `aetheris_scin_common_triage_v1.pt` | EfficientNet-B0 checkpoint with broad, non-diagnostic triage categories. |

Both notebooks also export training history and held-out predictions for clinician review. Do not copy a checkpoint into the Aetheris web application until a dermatologist has reviewed its errors, false negatives, threshold, and skin-tone subgroup results.

## Deliberate safeguards

- **Patient/case-level data splits** prevent images from the same person leaking into training and validation. The provided ISIC Kaggle mirror lacks `patient_id`, so it is restricted to image-level experimental training unless official supplementary metadata is attached.
- **Schema guards** stop execution if a Kaggle mirror differs from the expected official dataset contract.
- **SCIN differential labels** are mapped only to broad triage categories; ambiguous cases remain `uncertain`.
- **No public/patient data mixing:** never upload Aetheris patient images to Kaggle.
- **No diagnostic language:** outputs route to information, routine clinician review, or priority clinician review.

## Dataset records

Keep the Kaggle URL, original-source URL, download date, version, license, attribution text, and notebook commit hash in the Aetheris model registry for each trained model. Kaggle mirrors are a convenience; the original dataset license controls use.
