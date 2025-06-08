import { library, dom } from '@fortawesome/fontawesome-svg-core'
import { faTimesCircle, faLink, faQuoteLeft, faSpinner } from '@fortawesome/free-solid-svg-icons'

import '@fortawesome/fontawesome-svg-core/styles.css'

library.add(faLink, faQuoteLeft, faSpinner, faTimesCircle)

dom.watch()
