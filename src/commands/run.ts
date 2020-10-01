import { Command, flags } from '@oclif/command'
import cli from 'cli-ux';
import path from 'path';

import * as parser from "../helpers/parser";

export default class Run extends Command {
    static description = 'Generate an index.d.ts file containing Mongoose Schema interfaces. If no `path` argument is provided, the tool will expect all models to be exported from `./src/models` by default.'

    static flags = {
        help: flags.help({char: 'h'}),
        output: flags.string({ char: 'o', default: "./src/types/mongoose", description: "Path of output index.d.ts file" }),
        "dry-run": flags.boolean({ char: 'd', default: false, description: "Print output rather than writing to file" }),
        fresh: flags.boolean({ char: 'f', description: "Fresh run, ignoring previously generated custom interfaces" }),
    }

    // path of mongoose models folder
    static args = [
        {
            name: 'path',
            default: ".",
        },
    ]

    async run() {
        cli.action.start('Generating mongoose typescript definitions')
        const { flags, args } = this.parse(Run)

        const outputFilePath = flags.output.endsWith("index.d.ts") ? flags.output : path.join(flags.output, "index.d.ts");

        const customInterfaces = flags.fresh ? "" : parser.loadCustomInterfaces(outputFilePath)

        let fullTemplate: string;
        try {
            const modelsPath = await parser.findModelsPath(args.path)
            fullTemplate = parser.generateFileString({ modelsPath, customInterfaces })
        }
        catch (error) {
            this.error(error)
        }

        cli.action.stop()

        if (flags["dry-run"]) {
            this.log("Dry run detected, generated interfaces will be printed to console:\n")
            this.log(fullTemplate)
        }
        else {
            this.log(`Writing interfaces to ${outputFilePath}`);
            parser.writeInterfaceToFile(outputFilePath, fullTemplate);
            this.log('Writing complete 🐒')
        }
    }
}
