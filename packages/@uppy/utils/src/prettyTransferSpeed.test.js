const prettyTransferSpeed = require('./prettyTransferSpeed')

describe('prettyTransferSpeed', () => {
  it('should convert the specified number of seconds to a pretty ETA', () => {
    expect(prettyTransferSpeed(0)).toEqual('0 bit/s')
    expect(prettyTransferSpeed(1)).toEqual('1 bit/s')
    expect(prettyTransferSpeed(99)).toEqual('99 bit/s')
    expect(prettyTransferSpeed(750)).toEqual('750 bit/s')
    expect(prettyTransferSpeed(800)).toEqual('0.8 kbit/s')
    expect(prettyTransferSpeed(935)).toEqual('0.94 kbit/s')
    expect(prettyTransferSpeed(1024)).toEqual('1.02 kbit/s')
    expect(prettyTransferSpeed(10_240)).toEqual('10.2 kbit/s')
    expect(prettyTransferSpeed(99_899)).toEqual('99.9 kbit/s')
    expect(prettyTransferSpeed(-99_899)).toEqual('-99.9 kbit/s')
    expect(prettyTransferSpeed(100_000)).toEqual('100 kbit/s')
    expect(prettyTransferSpeed(977_237)).toEqual('977 kbit/s')
    expect(prettyTransferSpeed(977_238)).toEqual('1 Mbit/s')
    expect(prettyTransferSpeed(1_000_001)).toEqual('1 Mbit/s')
    expect(prettyTransferSpeed(999_500_001)).toEqual('999.5 Mbit/s')
  })

  it('should not crash when passed unrealistic values', () => {
    expect(prettyTransferSpeed(10 ** 14)).toEqual('100 Tbit/s')
    expect(prettyTransferSpeed(Number.MAX_SAFE_INTEGER - 1)).toEqual('9007.2 Tbit/s')
    expect(prettyTransferSpeed(Infinity)).toEqual('>9000 Tbit/s')
    expect(prettyTransferSpeed(-Infinity)).toEqual('<-9000 Tbit/s')
  })
})
