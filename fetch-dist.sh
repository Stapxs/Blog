#!/bin/sh
# ============================================================================
# fetch-dist.sh — 下载最新 GitHub Actions 构建产物（dist）并更新到目标目录
#
# 用法:
#   ./fetch-dist.sh <目标目录>
#
# 行为:
#   1. 查询仓库最新一次「未过期」的 dist 产物（即 Actions 页面上的 dist.zip）
#      —— 构建时间显示为本地时间
#   2. 下载（显示进度条）并做 sha256 完整性校验（对齐 GitHub 返回的 digest）
#   3. 解压到临时目录，再 rsync 镜像同步到目标目录
#      —— 会删除目标目录里多余的旧文件（适合静态站点产物）
#
# 认证（产物下载必须带凭证，公开仓库也不例外，二选一）:
#   1. 安装 gh 并登录:  gh auth login
#   2. 或设置环境变量 GITHUB_TOKEN（需要 actions:read 权限）
#
# 依赖: jq、unzip、rsync
# ============================================================================
set -eu

# ------------------------------ 可按需修改 ---------------------------------
REPO="Stapxs/Blog"        # <owner>/<repo>
ARTIFACT="dist"           # 产物名（Actions 运行记录里显示的 zip 名）
# --------------------------------------------------------------------------

TARGET=${1:-}
[ -n "$TARGET" ] || { echo "用法: $0 <目标目录>" >&2; exit 1; }

die() { echo "错误: $*" >&2; exit 1; }

for cmd in jq unzip rsync; do
    command -v "$cmd" >/dev/null 2>&1 || die "缺少依赖: $cmd（请先安装）"
done

# ---- GitHub API 请求：优先 gh，其次 GITHUB_TOKEN + curl -------------------
HAVE_GH=0
command -v gh >/dev/null 2>&1 && HAVE_GH=1

api_text() {   # api_text <url>: JSON 响应输出到 stdout
    if [ "$HAVE_GH" = 1 ]; then
        gh api "$1"
    elif [ -n "${GITHUB_TOKEN:-}" ]; then
        curl -fsSL -H "Authorization: Bearer ${GITHUB_TOKEN}" \
             -H "Accept: application/vnd.github+json" "$1"
    else
        die "没有可用认证：请先 gh auth login，或设置 GITHUB_TOKEN"
    fi
}

auth_token() {   # 取认证 token：优先 gh 登录凭证，其次 GITHUB_TOKEN
    if [ "$HAVE_GH" = 1 ]; then
        gh auth token 2>/dev/null || true
    elif [ -n "${GITHUB_TOKEN:-}" ]; then
        printf '%s\n' "$GITHUB_TOKEN"
    fi
}

api_download() {   # api_download <url> <输出文件> —— 带 curl 进度条下载
    if command -v curl >/dev/null 2>&1 && TOKEN=$(auth_token) && [ -n "$TOKEN" ]; then
        curl -fL --progress-bar \
             -H "Authorization: Bearer ${TOKEN}" -o "$2" "$1"
    elif [ "$HAVE_GH" = 1 ]; then
        gh api "$1" > "$2"        # 回退：无 curl 或取不到 token（无进度显示）
    else
        die "没有可用认证：请先 gh auth login，或设置 GITHUB_TOKEN"
    fi
}

sha256_of() {   # macOS 用 shasum，Linux 用 sha256sum
    if command -v shasum >/dev/null 2>&1; then
        shasum -a 256 "$1" | awk '{print $1}'
    else
        sha256sum "$1" | awk '{print $1}'
    fi
}

# ---- 1. 找到最新未过期的产物 ----------------------------------------------
echo "▸ 查询 ${REPO} 最新的「${ARTIFACT}」产物 ..."
JSON=$(api_text "https://api.github.com/repos/$REPO/actions/artifacts?name=$ARTIFACT&per_page=30") \
    || die "查询产物列表失败（检查 REPO 配置与认证状态）"

META=$(printf '%s' "$JSON" | jq -r '
    [ .artifacts[] | select(.expired == false) ]
    | sort_by(.created_at) | last
    | if . == null then "" else
        [ .id, .archive_download_url, .digest,
          (.created_at | fromdateiso8601 | localtime
                      | strftime("%Y-%m-%d %H:%M:%S")),   # UTC → 本地时间
          (.size_in_bytes | tostring),
          (.workflow_run.id // "-" | tostring),
          (.workflow_run.head_sha // "-") ]
        | @tsv
      end')
[ -n "$META" ] || die "没有找到未过期的「${ARTIFACT}」产物（可能已过期被清理）"

IFS="$(printf '\t')" read -r _ART_ID ART_URL DIGEST CREATED ART_SIZE RUN_ID SHA <<EOF
$META
EOF

SHA_SHORT=$(printf '%s' "$SHA" | cut -c1-7)
echo "▸ 最新构建: run #${RUN_ID}  commit ${SHA_SHORT}  (本地时间 ${CREATED})"

# ---- 2. 下载 + 校验 --------------------------------------------------------
TMPROOT=$(mktemp -d "${TMPDIR:-/tmp}/fetch-dist.XXXXXX")
ZIP="$TMPROOT/dist.zip"
STAGE="$TMPROOT/stage"
mkdir "$STAGE"
trap 'rm -rf "$TMPROOT"' EXIT HUP INT TERM

echo "▸ 下载 dist.zip（约 $((ART_SIZE / 1048576)) MB）..."
api_download "$ART_URL" "$ZIP" || die "下载失败"

EXPECTED=${DIGEST#sha256:}
if [ -n "$EXPECTED" ] && [ "$EXPECTED" != "null" ]; then
    ACTUAL=$(sha256_of "$ZIP")
    [ "$ACTUAL" = "$EXPECTED" ] \
        || die "sha256 校验失败（预期 $EXPECTED，实际 $ACTUAL）"
    echo "▸ sha256 校验通过"
fi

# ---- 3. 解压并镜像同步到目标目录 ------------------------------------------
echo "▸ 解压 ..."
unzip -q "$ZIP" -d "$STAGE"
COUNT=$(find "$STAGE" -type f | wc -l | tr -d ' ')

echo "▸ 同步到 ${TARGET} ..."
mkdir -p "$TARGET"
rsync -a --delete "$STAGE"/ "$TARGET"/

echo "✔ 完成：${COUNT} 个文件已更新到 ${TARGET}（run #${RUN_ID}, ${SHA_SHORT}）"
