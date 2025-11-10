Param(
	[int]$IntervalSeconds = 15,
	[switch]$NoPush
)

$ErrorActionPreference = 'SilentlyContinue'

function Get-CurrentBranch {
	try {
		$branch = (git rev-parse --abbrev-ref HEAD).Trim()
		return $branch
	} catch {
		return $null
	}
}

function Get-Upstream {
	try {
		$up = (git rev-parse --abbrev-ref --symbolic-full-name @{u}) 2>$null
		if ($LASTEXITCODE -ne 0 -or -not $up) { return $null }
		return $up.Trim()
	} catch {
		return $null
	}
}

function Do-AutoCommit {
	try {
		$status = git status --porcelain
		if ($status) {
			git add -A | Out-Null
			$ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
			$branch = Get-CurrentBranch
			$commitMsg = "chore(auto-commit): $ts on $branch"
			git commit -m $commitMsg --no-verify | Out-Null
			
			if (-not $NoPush.IsPresent) {
				$upstream = Get-Upstream
				if ($upstream) {
					git push | Out-Null
				} else {
					# No upstream set; try pushing to origin/<branch>
					if ($branch) {
						git push -u origin $branch | Out-Null
					}
				}
			}
			Write-Host "[auto-commit] $commitMsg"
		}
	} catch {
		Write-Host "[auto-commit] Error: $($_.Exception.Message)"
	}
}

Write-Host "[auto-commit] Watching repo for changes every $IntervalSeconds second(s). Press Ctrl+C to stop."
while ($true) {
	Do-AutoCommit
	Start-Sleep -Seconds $IntervalSeconds
}


