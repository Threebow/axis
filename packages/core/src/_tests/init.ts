import { use as chaiUse } from "chai"
import sinonChai from "sinon-chai"
import chaiUuid from "chai-uuid"
import chaiString from "chai-string"
import chaiAsPromised from "chai-as-promised"

chaiUse(sinonChai)
chaiUse(chaiUuid)
chaiUse(chaiString)
chaiUse(chaiAsPromised)
