import 'vtk.js/Sources/favicon';
import vtkActor                   from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkFullScreenRenderWindow  from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper                  from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPolyDataReader          from 'vtk.js/Sources/IO/Legacy/PolyDataReader';
import XMLReader          		    from 'vtk.js/Sources/IO/XML/XMLReader';
import vtkXMLPolyDataReader       from 'vtk.js/Sources/IO/XML/XMLPolyDataReader';
import vtkColorTransferFunction   from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkColorMaps               from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps';
import request                    from 'request';
// import swiftClient                from 'openstack-swift-client'; // TODO: IMPLEMENT

// For styling slider/dropdown
import controlPanel               from './controller.html'; 

const __BASE_PATH__ = 'localhost:8080';
const __URL__ = "https://swift.rc.nectar.org.au:8888/v1/AUTH_53ca8bcbf7fd4140b05648b13b7b7898/CardiacContainerTest/";

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------
const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();
const resetCamera = renderer.resetCamera;
const render = renderWindow.render;

fullScreenRenderer.addController(controlPanel);
const representationSelector = document.querySelector('.representations');
const voltageSolutionSlider = document.querySelector('.vSolns');
const datasetSelector = document.querySelector('.datasets');
const displayEdgeSelector = document.querySelector('.visibility');

const reader = vtkXMLPolyDataReader.newInstance();
var actor = '';

// -----------------------------------------------------------
// Files located on NectarCloud object store; 
// <13/2/18> currently CORS are disabled on the obj store end
// ultimately will use swift for obj store access
// ----------------------------------------------------------- 
var baseModelResult = 'DS_1/Vsoln_testrun_';
var middleObjStoreURL = baseModelResult + voltageSolutionSlider.value + '.vtp';
const baseObjStoreURL = __URL__;
const initialModelResult = baseObjStoreURL + middleObjStoreURL;
var fileLocation =  initialModelResult;

// -----------------------------------------------------------
// Initially display the mesh (pre cardiac simulation) and setup
// the different heart models that can be loaded
// -----------------------------------------------------------  
getObjectStoreContents();
initialiseDisplayedMesh(fileLocation);

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

// Show/Hide the visiblity of the surface mesh's edges
displayEdgeSelector.addEventListener('change', (e) => {
  actor.getProperty().setEdgeVisibility(!!e.target.checked);
  renderWindow.render();
});

// Modify how the displayed mesh looks (i.e. surface/points)
representationSelector.addEventListener('change', (e) => {
  const newRepValue = Number(e.target.value);
  const isWireframe = document.getElementsByClassName('visibility')[0];
  actor.getProperty().setRepresentation(newRepValue);
  actor.getProperty().setPointSize(4); // Set point size to 4
  if (newRepValue === 0 || newRepValue === 1) {
    isWireframe.checked = false;
    isWireframe.disabled = true;
  } else { 
    isWireframe.disabled = false;
  }

  renderWindow.render();
});

// Select different datasets to load from a drop down
datasetSelector.addEventListener('change', (e) => {

  // Files located on the Object Store
  baseModelResult = 'DS_' + e.target.value + '/Vsoln_testrun_';
  middleObjStoreURL = baseModelResult + voltageSolutionSlider.value + '.vtp';
  fileLocation =  baseObjStoreURL + middleObjStoreURL;
  
  actor.delete();
  initialiseDisplayedMesh(fileLocation);

  renderWindow.render();
});

// Update the displayed scalar values
voltageSolutionSlider.addEventListener('input', (e) => {
  fileLocation = baseObjStoreURL + baseModelResult + e.target.value + '.vtp'; // new file location
  
  // Simulation model file results
  updateScalarData(fileLocation); /* Added baseObjStoreURL because loaded from website */
});

// -----------------------------------------------------------
// Functions to display & alter the state of the displayed data 
// -----------------------------------------------------------

/**
 * Request to get a list of object store container contents from the objectstore
 */
function getObjectStoreContents() {
  request(__URL__, (err, res, body) => {
    if (err) { 
      return console.log(err); 
    }

    const containerElements = body.split(/\r?\n/); // Split at \n
    const containerNumber = containerElements[containerElements.length - 2].split(/\//)[0].split(/_/)[1]; // Split at / and then at _

    setupNumberOfDatasets(containerNumber);
  });
}

/**
 * Assign a colour map to the displayed simulation (scalar value targeted); as 
 * well as make sure that the rendering of the object is in-lign with it's previous
 * state if there is one (i.e. selected wireframe for a previous dataset).
 * @param  {String} file 
 *         The dataset file that is to be read and have its relevant contents extracted 
 *         and visualised 
 */
function initialiseDisplayedMesh(file) {
  reader.setUrl(file).then(() => {
    reader.update();
    const polydata = reader.getOutputData();
    
    // -----------------------------------------------------------
    // Create the colour mapping for the rendered heart mesh,
    // taken and modified from the SaveMeshAndScalarValues.py script
    // -----------------------------------------------------------
    // Applying a preset instead.
    // const presetName = 'Cool to Warm';  
    // const preset = vtkColorMaps.getPresetByName(presetName);
    // colourTransferFnc.applyColorMap(preset);
    const colourTransferFnc = vtkColorTransferFunction.newInstance();
    colourTransferFnc.addRGBPoint(0.0, 0.23137254902000001, 0.298039215686, 0.75294117647100001);
    colourTransferFnc.addRGBPoint(1.0, 0.70588235294099999, 0.015686274509800001, 0.149019607843);

    const mapper = vtkMapper.newInstance({
      interpolateScalarsBeforeMapping: false,
      scalarVisibility: true // Whether scalar data is displayed
    });

    mapper.setInputData(polydata);
    mapper.setLookupTable(colourTransferFnc);
    
    // Setup actor & add mapper 
    actor = vtkActor.newInstance();
    actor.setMapper(mapper);

    // Maintain model status
    initialiseModelStatus(actor);

    // Render everything + reset
    renderer.addActor(actor);
    resetCamera();
    render();
  });
}

/**
 * A helper function to: initialiseDisplayedMesh. Makes sure that the different status' 
 * of the model are kept when a new dataset is loaded (i.e. display model in point form/ 
 * leave 'visible edges' checked).
 * @param  {vtkActor} actor 
 *         Represents an object (geometry & properties -> the heart in this case) in a rendered scene
 */
function initialiseModelStatus(actor) {
    const isWireframe = document.getElementsByClassName('visibility')[0];    
    const allRepresentations = document.getElementsByClassName('representations');
    const currentRepSelection = allRepresentations[0].selectedIndex;

    // Leave checkbox checked if it was already selected
    if(isWireframe.checked && (actor.getProperty().getEdgeVisibility() !== true)) {
      actor.getProperty().setEdgeVisibility(true);
    }

    // Disable checkbox for point/wireframe
    actor.getProperty().setRepresentation(currentRepSelection);

    if (currentRepSelection === 0) {
      actor.getProperty().setPointSize(4); // Increase point size
      isWireframe.checked = false;
      isWireframe.disabled = true;
    } else if (currentRepSelection === 1) {
      isWireframe.checked = false;
      isWireframe.disabled = true;
    } else {
      isWireframe.disabled = false;
    }
}

/**
 * Currently displays how many data sets there are to choose from and
 * display information from the dropdown menu.
 * @param  {int} maxValidLinks 
 *         The maximum number of dataset folders-existing
 *         to be displayed-on the object store's container.
 */
function setupNumberOfDatasets(maxValidLinks) {
  var datasetsElement = document.getElementsByClassName('datasets')[0];
  var file = '';

  for (var i = 1; i <= maxValidLinks; i++) { // maxValidLinks = 6 at this stage
    file = document.createElement('option');
    file.text = 'Dataset #' + i; // Drop down menu label
    file.value = i; // Value of the option.
    datasetSelector.appendChild(file);
  }
}

/**
 * Extracts the scalar data from the data of the saved voltage solutions and 
 * uses the new data to update the existing scalar information.
 * 
 * @param  {String} newFileLocation 
 *         The location of the file that corresponds to the slider value.
 */
function updateScalarData(newFileLocation) {
  reader.setUrl(newFileLocation).then(() => {
    reader.update();
    var scalarData = reader.getOutputData().get().pointData.getScalars();
    
    // Pre-simulation model file results
    if (newFileLocation === initialModelResult) {
      scalarData = '';
    }

    actor.getMapper().getInputData().getPointData().setScalars(scalarData);
    actor.modified();
    renderWindow.render();
  });
}

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------
global.reader = reader;
global.fullScreenRenderer = fullScreenRenderer;