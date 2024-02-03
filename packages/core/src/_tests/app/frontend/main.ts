import { initClient } from "../../../helpers/frontend/initClient.helper"

import "./main.scss"

await initClient(require.context("../modules", true, __FRONTEND_INIT_REGEX__))
