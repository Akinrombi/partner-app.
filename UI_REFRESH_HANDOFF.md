# Rider UI refresh handoff

- Branch: `ui/rider-experience-refresh`
- `partner-ui-refresh.js` retains the existing shift-controls enhancement and adds accessible focus styles, more usable touch targets, reduced-motion support, and a compact mobile layout for the shift panel.
- Before deployment, confirm `index.html` loads `partner-ui-refresh.js` after the base theme/styles. If it is not loaded, add the script reference without removing or replacing existing app scripts.
- No order, dispatch, account, rider-location, or backend behavior is intentionally changed.
- Run the repository's `zenzora-checks.yml` workflow and manually test shift start/stop, feedback messages, keyboard navigation, mobile layout, and both rider themes before release.

This is a feature-branch handoff, not a deployment approval. Keep `main` unchanged until the review and checks pass.
