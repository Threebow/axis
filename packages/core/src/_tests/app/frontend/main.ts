import { initClient } from "../../../index.client"

import "./main.scss"

await initClient(require.context("../modules", true, __FRONTEND_INIT_REGEX__))
