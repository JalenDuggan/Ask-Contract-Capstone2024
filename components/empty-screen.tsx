import { UseChatHelpers } from 'ai/react'

import { Button } from '@/components/ui/button'
import { ExternalLink } from '@/components/external-link'
import { IconArrowRight } from '@/components/ui/icons'

const exampleMessages = [
  {
    heading: 'Summerize this EULA',
    message: `Give me a summary for the follwing document `
  },
  {
    heading: 'Find any dangerous clauses',
    message: 'Find any suspisous or harmful clauses in this document'
  },
  {
    heading: 'What are some of the costs associated with this contract',
    message: `Are there any hidden costs in this document`
  }
]

export function EmptyScreen({ setInput }: Pick<UseChatHelpers, 'setInput'>) {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="rounded-lg border bg-background p-8">
        <h1 className="mb-2 text-lg font-semibold">
          Welcome to the EULA Analyzer 🔎📄
        </h1>
        <p className="mb-2 leading-normal text-muted-foreground">
        This is an AI-powered chatbot application that allows you to upload and analyze your EULA documents {' '}
        </p>
        <p className="leading-normal text-muted-foreground">
         Start by uploading your EULA documents
        </p>
        <div className="mt-4 flex flex-col items-start space-y-2">
          {exampleMessages.map((message, index) => (
            <Button
              key={index}
              variant="link"
              className="h-auto p-0 text-base"
              onClick={() => setInput(message.message)}
            >
              <IconArrowRight className="mr-2 text-muted-foreground" />
              {message.heading}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
