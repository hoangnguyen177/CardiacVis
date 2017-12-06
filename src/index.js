import 'vtk.js/Sources/favicon';
import vtkActor                   from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkFullScreenRenderWindow  from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper                  from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPolyDataReader          from 'vtk.js/Sources/IO/Legacy/PolyDataReader';
import XMLReader          		  from 'vtk.js/Sources/IO/XML/XMLReader';
import vtkXMLPolyDataReader       from 'vtk.js/Sources/IO/XML/XMLPolyDataReader';

const fileName = 'heart.vtk'; // 'uh60.vtk'; // 'luggaBody.vtk';
const __BASE_PATH__ = 'localhost:8080'
// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------
const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();
const resetCamera = renderer.resetCamera;
const render = renderWindow.render;
//const polydata = "";
// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------
/*
const reader = vtkPolyDataReader.newInstance();
//reader.ReadAllScalarsOn();
reader.setUrl('/data/heart.vtk').then(() => {
  console.log("reader....");
  console.log(reader);

  const polydata = reader.getOutputData(0);
  //const scalardata = reader.getOutputData(1);
  
  console.log("polydata....");
  console.log(polydata);
  console.log(polydata.getPolys().length);
  
  console.log("sclarrrr----");
  console.log(polydata.getPointData(0).length);


  //console.log("sclarrrr");
  //console.log(scalardata);
  //polydata.GetPointData().SetScalars(scalardata);
  
  const mapper = vtkMapper.newInstance();
  const actor = vtkActor.newInstance();
  actor.setMapper(mapper);
  mapper.setInputData(polydata);
  renderer.addActor(actor);
  resetCamera();
  render();
});
*/
const reader = vtkXMLPolyDataReader.newInstance();
//reader.ReadAllScalarsOn();
reader.setUrl('/data/heart.vtp').then(() => {
  reader.update();
  console.log("reader....");
  console.log(reader);

  
  const polydata = reader.getOutputData();
  //const scalardata = reader.getOutputData(1);
  
  console.log("polydata....");
  console.log(polydata);
  console.log(polydata.get());
  
  console.log("--points....");  
  console.log(polydata.get().points.get());//

  console.log("--polys....");
  console.log(polydata.get().polys.get());//
  
  console.log("--pointData....");
  console.log(polydata.get().pointData.get());


  // console.log("--verts....");
  // console.log(polydata.get().verts.get());

  
  // console.log("--strips....");
  // console.log(polydata.get().strips.get());


  // console.log("--lines....");
  // console.log(polydata.get().lines.get());


  // console.log("--cellData....");
  // console.log(polydata.get().cellData.get());
		
  // console.log("--fieldData....");
  // console.log(polydata.get().fieldData.get());

  /*
  //console.log(polydata.getPolys().length);
  console.log("cells:::" + polydata.getNumberOfCells());
  console.log("lines:::" +polydata.getNumberOflines());
  console.log("polys:::" +polydata.getNumberOfpolys());
  console.log("strips:::" +polydata.getNumberOfstrips());
  console.log("verts:::" +polydata.getNumberOfverts());
  
  //DATASET POLYDATA
  console.log("points");
  console.log(polydata.getPoints());
  console.log(polydata.getPoints().getData());

  //POLYGONS
  console.log("polys");
  console.log(polydata.getPolys());
  console.log(polydata.getPolys().getData());

  //NOTHING
  //console.log("cell data");
  //console.log(polydata.getCellData());
  //console.log(polydata.getCellData().get());

  console.log("sclarrrr----");
  console.log(polydata.getPointData().get());
  console.log(polydata.getPointData().getArrays());
  console.log(polydata.getPointData().getArrays()[0].getData().length);
  

  //console.log("sclarrrr");
  //console.log(scalardata);
  //polydata.GetPointData().SetScalars(scalardata);
  */

  const mapper = vtkMapper.newInstance();
  const actor = vtkActor.newInstance();
  actor.setMapper(mapper);
  mapper.setInputData(polydata);
  renderer.addActor(actor);
  resetCamera();
  render();
});

//another reader here

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------
global.reader = reader;
global.fullScreenRenderer = fullScreenRenderer;