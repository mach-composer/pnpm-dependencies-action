# pnpm-dependencies-action

The `mach-composer/pnpm-dependencies-action` can be used to render a string containing `--git-filter-path ...` arguments needed for the [mach-composer/new-component-version-action](https://github.com/mach-composer/new-component-version-action) within a monorepo context.

In order for that action to generate a good list of changes made to a component it needs to be aware of the dependencies within the monorepo. Any change in a dependency could trigger a new component version and must be part of the changelog.
By providing a full list of `--get-filter-path` arguments for each dependency we ensure all related commits are part of the output.

## Versions

Pin to a release tag or a major version ref — never reference `main`, as it
can contain unreleased changes.

| Ref       | Runtime | Notes                                                                     |
| --------- | ------- | ------------------------------------------------------------------------- |
| `@v2.1.0` | Node 24 | **Latest release.** Security updates, `rolldown` bundle, pnpm 12.         |
| `@v2`     | Node 24 | Moving major version branch, kept in sync with the latest `v2.x` release. |
| `@v1`     | Node 20 | Previous release.                                                         |

We recommend pinning the commit SHA of a release tag with the version as a
comment (e.g. using [pinact](https://github.com/suzuki-shunsuke/pinact)):

```yaml
- uses: mach-composer/pnpm-dependencies-action@e599daf153712c5df8debd8e936b3023f36e2e09 # v2.1.0
```

### Releasing

`main` and `v2` point to the same commit. To release, tag the commit on `main`
and fast-forward the `v2` branch to it:

```sh
git tag -a v2.x.y -m "v2.x.y" && git push origin v2.x.y
git push origin main:v2
```

Always merge into `main` and fast-forward `v2` afterwards; never commit or
squash-merge directly into `v2`, otherwise the branches diverge.

## Usage

where `service-name` could be `catalog` for example.

```yaml
- uses: mach-composer/pnpm-dependencies-action@v2
  id: filter-paths
  with:
    package: "@commerce-backend/${{ inputs.service-name }}"

- name: Mach Composer Cloud - Register version
  uses: mach-composer/new-component-version-action@v0.1.1
  with:
    organization: my-org
    project: my-mach-project
    component: ${{ inputs.service-name }}
    client_id: ${{ secrets.MCC_CLIENT_ID }}
    client_secret: ${{ secrets.MCC_CLIENT_SECRET }}
    args: --verbose --git-filter-path backend/services/${{ inputs.service-name }} ${{ steps.filter-paths.outputs.paths }}
```

## TODO

Some improvements can be made to this action;

- [ ] Instead of outputting a string like `--git-filter-path backend/packages/graphql-types --git-filter-path backend/packages/cache-utils --git-filter-path /packages/observability` instead it should output an array of strings;
      `["backend/packages/graphql-types", "backend/packages/cache-utils", "/packages/observability"]` so it can be used for more purposes as well.
