// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as path from "path";
import axios from "axios";
import * as jwt from "jsonwebtoken";
import { Configuration, CreateEditResponse, OpenAIApi } from "openai";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "codexai" is now active!');

  let currentPagePrediction = vscode.commands.registerCommand(
    "codexai.currentPage",
    async () => {
      const apiKey = vscode.workspace
        .getConfiguration("codexai")
        .get("openai_api_key") as string;

      if (!apiKey) {
        vscode.window.showErrorMessage(
          "API Key Not found! Enter your OpenAI API Key in Settings!"
        );
        return;
      }

      const prompt = await vscode.window.showInputBox({
        title: "Enter Prompt",
      });

      if (prompt) {
        const editor = vscode.window.activeTextEditor;

        if (editor) {
          let document = editor.document;

          // Get the document text
          const documentText = document.getText();

          let prediction: CreateEditResponse;

          try {
            prediction = await vscode.window.withProgress(
              {
                location: vscode.ProgressLocation.Notification,
                title: "Loading Response...",
              },
              () => callOpenAI(prompt, apiKey, documentText)
            );
          } catch (e) {
            vscode.window.showErrorMessage("Error communicating with OpenAI");
          }

          // const pick = await vscode.window.showQuickPick(
          //   prediction.choices.map((choice) => choice.text || ""),
          //   {
          //     canPickMany: false,
          //   }
          // );
          editor.edit((builder) => {
            const doc = editor.document;

            builder.replace(
              new vscode.Range(
                doc.lineAt(0).range.start,
                doc.lineAt(doc.lineCount - 1).range.end
              ),
              prediction.choices[0].text || ""
            );
          });
        }
      }
    }
  );

  context.subscriptions.push(currentPagePrediction);
}

async function callOpenAI(prompt: string, apiKey: string, input: string) {
  const configuration = new Configuration({
    apiKey: apiKey,
  });

  const openai = new OpenAIApi(configuration);

  try {
    const response = await openai.createEdit({
      model: "code-davinci-edit-001",
      input,
      instruction: prompt,
      temperature: 0,
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// This method is called when your extension is deactivated
export function deactivate() {}
