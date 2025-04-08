export type Counter = {
  version: '0.2.0'
  name: 'counter'
  address: string
  metadata: {
    address: string
    name: string
    version: string
    spec: string
  }
  instructions: [
    {
      name: 'initialize'
      discriminator: [0, 0, 0, 0, 0, 0, 0, 0]
      accounts: [
        {
          name: 'user'
          isMut: true
          isSigner: true
        },
        {
          name: 'counter'
          isMut: true
          isSigner: false
          pda: {
            seeds: [
              {
                kind: 'const'
                type: 'string'
                value: 'counter'
              }
            ]
          }
        },
        {
          name: 'systemProgram'
          isMut: false
          isSigner: false
        }
      ]
      args: []
    },
    {
      name: 'increment'
      discriminator: [1, 0, 0, 0, 0, 0, 0, 0]
      accounts: [
        {
          name: 'counter'
          isMut: true
          isSigner: false
          pda: {
            seeds: [
              {
                kind: 'const'
                type: 'string'
                value: 'counter'
              }
            ]
          }
        }
      ]
      args: []
    }
  ]
  accounts: [
    {
      name: 'counter'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'count'
            type: 'u64'
          },
          {
            name: 'bump'
            type: 'u8'
          }
        ]
      }
    }
  ]
}

export const IDL: Counter = {
  version: '0.2.0',
  name: 'counter',
  address: 'NZqPEssvQPTGo31JGNzE1P2PhysusspkrGPbJaqKWTN',
  metadata: {
    address: 'NZqPEssvQPTGo31JGNzE1P2PhysusspkrGPbJaqKWTN',
    name: 'counter',
    version: '0.2.0',
    spec: '1.0.0'
  },
  instructions: [
    {
      name: 'initialize',
      discriminator: [0, 0, 0, 0, 0, 0, 0, 0],
      accounts: [
        {
          name: 'user',
          isMut: true,
          isSigner: true
        },
        {
          name: 'counter',
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: 'const',
                type: 'string',
                value: 'counter'
              }
            ]
          }
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false
        }
      ],
      args: []
    },
    {
      name: 'increment',
      discriminator: [1, 0, 0, 0, 0, 0, 0, 0],
      accounts: [
        {
          name: 'counter',
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: 'const',
                type: 'string',
                value: 'counter'
              }
            ]
          }
        }
      ],
      args: []
    }
  ],
  accounts: [
    {
      name: 'counter',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'count',
            type: 'u64'
          },
          {
            name: 'bump',
            type: 'u8'
          }
        ]
      }
    }
  ]
}
