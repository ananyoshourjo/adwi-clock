# Security policy

Adwi Clock does not have accounts or a project-operated backend, but privacy
and dependency issues still matter.

Please do not publish a suspected vulnerability in a public issue. Use GitHub's
private vulnerability reporting for this repository if it is enabled, or
contact the maintainer privately through their GitHub profile.

Include the affected version, platform, reproduction steps, and likely impact.
Please give the maintainer a reasonable opportunity to investigate before
sharing details publicly.

Dependency updates are checked weekly through Dependabot. Expo and React
Native have a tightly matched dependency graph, so please do not apply
`npm audit fix --force` blindly: an apparent fix can be an incompatible
framework downgrade or major upgrade. Prefer the SDK-compatible versions
reported by Expo Doctor and test a native build after framework updates.
