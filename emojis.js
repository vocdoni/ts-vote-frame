import fs from 'fs-extra'
import { exec } from 'node:child_process'
import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const repoUrl = 'https://github.com/microsoft/fluentui-emoji'
const cloneDir = path.join(__dirname, 'temp') // Directory where the repo will be cloned or updated
const assetsPath = path.join(cloneDir, 'assets')
const outputPath = path.join(__dirname, 'public', 'emojis')

// Function to update or clone the repository
function updateOrCloneRepository() {
  if (fs.existsSync(cloneDir)) {
    console.log('Repository already exists. Pulling latest changes...')
    exec(`git -C "${cloneDir}" pull`, handleGitResponse)
  } else {
    console.log('Cloning repository...')
    exec(`git clone --depth 1 ${repoUrl} "${cloneDir}"`, handleGitResponse)
  }
}

// Handle Git response for clone or pull
function handleGitResponse(err, stdout, stderr) {
  if (err) {
    console.error('Error updating the repository:', err)
    return
  }
  console.log('Repository updated successfully.')
  processAssets()
}

// Process assets after repository is ready
function processAssets() {
  // Create the output directory if it doesn't exist
  fs.ensureDirSync(outputPath)

  // Read the directories inside the assets folder
  fs.readdir(assetsPath, { withFileTypes: true }, (err, folders) => {
    if (err) {
      console.error('Error reading the assets directory:', err)
      return
    }

    folders.forEach((folder) => {
      if (folder.isDirectory()) {
        const metadataPath = path.join(assetsPath, folder.name, 'metadata.json')
        const colorPath = path.join(assetsPath, folder.name, 'Color')

        // Read and parse the metadata.json file
        fs.readJson(metadataPath)
          .then((metadata) => {
            // Locate the SVG file in the Color folder
            fs.readdir(colorPath, (readDirErr, files) => {
              if (readDirErr) {
                console.error(`Error reading the Color directory for ${folder.name}:`, readDirErr)
                return
              }

              // Assuming there's only one SVG file in the Color folder
              const svgFileName = files.find((file) => file.endsWith('.svg'))
              if (svgFileName) {
                const svgFilePath = path.join(colorPath, svgFileName)
                const outputFilePath = path.join(
                  outputPath,
                  `${metadata.unicode.replace(/\s/g, '_')}.svg`
                )

                // Copy and rename the SVG file to the output directory
                fs.copy(svgFilePath, outputFilePath)
                  .then(() => {
                    console.log(`SVG file for ${folder.name} copied to ${outputFilePath}`)
                  })
                  .catch((copyErr) => {
                    console.error(`Error copying SVG for ${folder.name}:`, copyErr)
                  })
              }
            })
          })
          .catch((readErr) => {
            console.error(`Error reading metadata.json for ${folder.name}:`, readErr)
          })
      }
    })
  })
}

// Start the update or clone process
updateOrCloneRepository()
