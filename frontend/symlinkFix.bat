FOR /F "tokens=*" %%a in ('node -e "console.log(require('fs').realpathSync(process.cwd()))"') do (
	SET "OUTPUT=%%a"
)
pushd "%OUTPUT%"
npm run dev-local
popd