import { DocNode, parseTemplate } from "./manipulateDom";
import { FileSystem } from "@/lib/fileSystem/FileSystem";
import { serverMethods } from "@/lib/serverMethods";
import { uploadGeneratedFile } from "../uploadFiles";
import { convertImageToWebP, getImageData } from "@/pages/upload/uploadUtilities";
import { showAlert } from "../ShowModal/showModal";
// import { d } from "./CodeEditor.vue";

export interface WindowFunctionDependencies {
  updateFileInEditor: (path: string, content: string) => void;
  d: any;
}

async function getNode(xpath, deps: WindowFunctionDependencies) {
  let result = await FileSystem.getFile(deps.d.previewingFilePath);
  if (!result.content) {
    return;
  }
  let content = new TextDecoder().decode(result.content);
  let match = content.match(/<template>([\s\S]*)<\/template>/g)
  let template = match?.[0];
  if (template) {
    console.log("Template isss", template)
    let doc = parseTemplate(template);
    console.log("doc is", doc)
    let element = doc.getElementByXPath(xpath, doc);
    console.log("element is", element, "xpath", xpath)
    return { element, template, content, doc };
  }
}
function isElementInVFor(el: DocNode | null): boolean {
  while (el) {
    if (el.hasAttribute("v-for")) {
      return true;
    }
    el = el.parentElement;
  }
  return false;
}

function hasSiblingWithVFor(el: DocNode): boolean {
  console.log("el is", el)
  const parent = el.parentElement;
  if (!parent) return false;
  for (let i = 0; i < parent.children.length; i++) {
    const sibling = parent.children[i];
    if (sibling !== el && sibling.hasAttribute("v-for")) {
      return true;
    }
  }
  return false;
}

export function registerWindowFunctions(deps: WindowFunctionDependencies) {
  // Function to test if an element can be edited
  (window as any).testIfCanEdit = async function (xpath: string) {
    xpath = "/template" + xpath.trim();
    let result = await getNode(xpath, deps);
    if (!result) return;

    let { element } = result;
    console.log("Result is", result);
    let inVFor = isElementInVFor(element);
    let hasSibling = hasSiblingWithVFor(element);
    let editableResult = !inVFor && !hasSibling;
    let error = "";

    if (inVFor) {
      error = "Element is inside a v-for so it can't be edited";
    } else if (hasSibling) {
      error = "Element has a sibling with a v-for";
    }

    return { result: editableResult, error };
  };

  // Function to update file content by modifying an element
  (window as any).updateFileContent = async function (data: any) {
    let { xpath, newContent, guid, css, setAttributes } = data;
    xpath = "/template" + xpath.trim();
    console.log("DATA IS", data);

    let result = await getNode(xpath, deps);
    let { element, template, content, doc } = result;

    // make sure that it is not a) a child of a v-for or b) a sibling of a v-for
    if (isElementInVFor(element) || hasSiblingWithVFor(element)) {
      console.warn("Element is inside a v-for or has a sibling with v-for. Skipping update.");
      return;
    }

    if (newContent !== null && newContent !== undefined)
      element.innerHTML = newContent;
    if (css)
      element.style = Object.assign(element.style || {}, css);
    if (setAttributes) {
      console.log("will set attris", setAttributes);
      element.setAttributes(setAttributes);
    } else {
      console.log("no set attributes");
    }

    let newTemplate = doc.stringify();
    content = content.replace(template, newTemplate);
    deps.updateFileInEditor(data.path, content);
  };

  // Function to generate an image from a prompt
  (window as any).generateImage = async function (shortDescription: string, imagePrompt: string) {
    try {
      // Get configuration from dependencies
      const provider = deps.d.imageProvider || "openai";
      const model = deps.d.imageModel || "dall-e-3";
      const apiKey = provider === "openai" ? deps.d.openAIApiKey : deps.d.falApiKey;

      // Generate a temporary ID for tracking
      const tempId = Math.random().toString();

      // Track image generation
      deps.d.imagesGenerating.push({ tempId, shortDescription, prompt: imagePrompt });

      // Show processing status
      console.log(`Generating image: "${shortDescription}" with prompt: "${imagePrompt}"`);

      // Call server method to generate the image
      const result = await serverMethods.aiChat.generateImage(apiKey, provider, model, imagePrompt, shortDescription);
      const response = result.data;
      let blob = await response.blob() as Blob;

      // Convert to file and then to WebP format
      let file = new File([blob], shortDescription + ".png", { type: "image/png" });
      let imageData = await getImageData(file);
      blob = await convertImageToWebP(imageData);
      file = new File([blob], shortDescription + ".webp", { type: "image/webp" });

      // Upload the generated file
      const uploadData = await uploadGeneratedFile(file, shortDescription, imagePrompt, provider, model);
      const { upload, accessUrl } = uploadData;
      // Remove from tracking
      deps.d.imagesGenerating = deps.d.imagesGenerating.filter(img => img.tempId !== tempId);

      // Return the result with the URL
      return {
        success: true,
        url: accessUrl,
        objectId: upload.objectId
      };
    } catch (err) {
      console.error("Error generating image", err);
      showAlert("Error generating image: " + err);
      return {
        success: false,
        error: err.toString()
      };
    }
  };

  // Function to get image URLs by their objectIds
  (window as any).getImageUrlsByObjectIds = async function (objectIds: string[]) {
    try {
      if (!objectIds || objectIds.length === 0) {
        return { success: true, items: {} };
      }
      
      // Fetch URLs for objectIds from server
      const imagesResult = await serverMethods.upload.getUploadUrlListByObjectId(objectIds);
      if (!imagesResult.data) {
        return { success: false, error: "Failed to fetch image URLs" };
      }
      
      return { 
        success: true, 
        items: imagesResult.data.items
      };
    } catch (err) {
      console.error("Error fetching image URLs", err);
      return { success: false, error: err.toString() };
    }
  };
}