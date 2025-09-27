#!/bin/bash

CLASP_SCRIP_ID=$1

# write to .clasp.json
cat <<EOF > .clasp.json
{
  "scriptId": "$CLASP_SCRIP_ID",
  "rootDir": "dist"
}
EOF

cp src/appscript.json dist/src/appscript.json
cp src/sidebar.html dist/src/sidebar.html