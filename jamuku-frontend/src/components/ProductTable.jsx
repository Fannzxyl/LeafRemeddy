export default function ProductTable({ products }) {
  return (
    <table className="min-w-full text-white border-collapse border border-green-600">
      <thead>
        <tr className="bg-green-800">
          <th className="border border-green-600 p-2">Nama Produk</th>
          <th className="border border-green-600 p-2">Kategori</th>
          <th className="border border-green-600 p-2">Stok</th>
          <th className="border border-green-600 p-2">Status</th>
        </tr>
      </thead>
      <tbody>
        {products.map((p) => (
          <tr key={p.id}>
            <td className="border border-green-600 p-2">{p.nama_produk}</td>
            <td className="border border-green-600 p-2">{p.kategori}</td>
            <td className="border border-green-600 p-2">{p.stok}</td>
            <td className="border border-green-600 p-2">{p.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
