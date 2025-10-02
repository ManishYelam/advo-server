// pptx.helper.js
const PptxGenJS = require('pptxgenjs');

/**
 * Creates a new PowerPoint presentation.
 * @returns {PptxGenJS.Presentation} The created presentation.
 */
const createPresentation = () => {
  return new PptxGenJS();
};

/**
 * Adds a slide to the presentation.
 * @param {PptxGenJS.Presentation} pptx - The PowerPoint presentation.
 * @param {string} layout - The layout of the slide (e.g., 'Title Slide', 'Title and Content').
 * @returns {PptxGenJS.Slide} The added slide.
 */
const addSlide = (pptx, layout = 'Title Slide') => {
  return pptx.addSlide({ layout });
};

/**
 * Adds a title to a slide.
 * @param {PptxGenJS.Slide} slide - The slide to which the title will be added.
 * @param {string} title - The title text.
 * @param {Object} options - Optional formatting options.
 */
const addTitle = (slide, title, options = {}) => {
  slide.addText(title, {
    x: 1,
    y: 1,
    w: '80%',
    h: 1.5,
    fontSize: 24,
    bold: true,
    color: '000000',
    align: 'center',
    ...options,
  });
};

/**
 * Adds content to a slide.
 * @param {PptxGenJS.Slide} slide - The slide to which the content will be added.
 * @param {string} content - The content text.
 * @param {Object} options - Optional formatting options.
 */
const addContent = (slide, content, options = {}) => {
  slide.addText(content, {
    x: 1,
    y: 2.5,
    w: '80%',
    h: '70%',
    fontSize: 18,
    color: '333333',
    align: 'left',
    ...options,
  });
};

/**
 * Saves the presentation to a file.
 * @param {PptxGenJS.Presentation} pptx - The PowerPoint presentation.
 * @param {string} filename - The filename to save as.
 */
const savePresentation = async (pptx, filename) => {
  try {
    await pptx.writeFile({ fileName: filename });
    console.log(`Presentation saved as ${filename}`);
  } catch (error) {
    console.error('Error saving presentation:', error);
  }
};

module.exports = {
  createPresentation,
  addSlide,
  addTitle,
  addContent,
  savePresentation,
};
