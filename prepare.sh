#!/bin/bash

CLASP_SCRIP_ID=$1

# write to .clasp.json
cat <<EOF > .clasp.json
{
  "scriptId": "$CLASP_SCRIP_ID",
  "rootDir": "dist"
}
EOF
