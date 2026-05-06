const { execSync } = require("child_process");

try {
    execSync("tsc -p src/ts/tsconfig.json", { stdio: "inherit" });
    execSync("npx gulp", { stdio: "inherit" });

    console.log("\nBuild successful!");
    console.log("\tPlease backup your current save file before previewing the extension!");
    console.log("\tThe preview will overwrite your current save file!\n");
} catch (err) {
    console.error("\nBuild failed.\n");
    console.error(`Reason: ${err}`);
    process.exit(1);
}
