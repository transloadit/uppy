module.exports = function prettyTransfertSpeed (bps) {
  if (bps >= Number.MAX_SAFE_INTEGER) {
    // MAX_SAFE_INTEGER is 2**53-1, which would be over nine thousand terabits per seconds.
    return `>9000 Tbit/s`
  }
  if (bps <= Number.MIN_SAFE_INTEGER) {
    return `<-9000 Tbit/s`
  }
  const magnitude = Math.log10(Math.abs(bps))
  if (magnitude < 2.9) {
    // From 0 bit/s to 794 bit/s
    return `${bps} bit/s`
  }
  if (magnitude < 4) {
    // From 0.8 kbit/s to 9.99 kbit/s
    return `${Math.round(bps / 10) / 100} kbit/s`
  }
  if (magnitude < 5) {
    // From 10.0 kbit/s to 99.9 kbit/s
    return `${Math.round(bps / 100) / 10} kbit/s`
  }
  if (magnitude < 5.99) {
    // From 100 kbit/s to 977 kbit/s
    return `${Math.round(bps / 1_000)} kbit/s`
  }
  if (magnitude < 9) {
    // From 1.0 Mbit/s to 999.9 Mbit/s
    return `${Math.round(bps / 100_000) / 10} Mbit/s`
  }
  if (magnitude < 12) {
    return `${Math.round(bps / 10 ** 8) / 10} Gbit/s`
  }
  return `${Math.round(bps / 10 ** 11) / 10} Tbit/s`
}
