FOR /F "tokens=*" %%a in ('node -e "console.log(require('fs').realpathSync(process.cwd()))"') do (
	SET "OUTPUT=%%a"
)
pushd "%OUTPUT%"
npm ci
npm run build
popd
