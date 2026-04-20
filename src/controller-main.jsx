import { render } from "preact";
import { ControllerPage } from "./pages/Controller";
import { applyControllerSessionFromUrl } from "./lib/sessionChannel/sessionChannel";
import "./styles/global.css";

applyControllerSessionFromUrl();

render(<ControllerPage />, document.getElementById("app"));
