import InputPassword from './InputPassword'

function OldPassword({ label, onOldPassword }: any) {
  return (
    <div className='pt-10'>
      <InputPassword label='Insert old password' onChange={onOldPassword} />
    </div>
  )
}

export default OldPassword
